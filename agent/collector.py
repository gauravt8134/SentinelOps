import os
import platform
import psutil
import requests
import time

try:
    import docker
except ImportError:
    docker = None

BACKEND_URL = "http://26.82.91.31:8000"
SERVER_ID = 1  

def get_system_stats():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    
    # 1. Swap Memory Tracking
    swap = psutil.swap_memory()
    swap_percent = swap.percent

    # 2. OS & Hardware Architecture Detection
    os_type = platform.system()
    arch_type = platform.machine()                  # e.g., x86_64 / AMD64
    py_version = platform.python_version()           # e.g., 3.11.15
    
    disk_path = 'C:\\' if os_type == 'Windows' else '/'
    try:
        disk = psutil.disk_usage(disk_path)
    except Exception:
        disk = psutil.disk_usage('/')

    net_io = psutil.net_io_counters()
    net_in = net_io.bytes_recv 
    net_out = net_io.bytes_sent 
    
    uptime_seconds = time.time() - psutil.boot_time() 
    active_processes = len(psutil.pids()) 

    # 3. Top Heavy Process Analyzer
    top_process_name = "Unknown"
    try:
        procs = sorted(psutil.process_iter(['name', 'memory_percent']), 
                       key=lambda p: p.info['memory_percent'] or 0, 
                       reverse=True)
        if procs:
            top_process_name = procs[0].info['name']
    except Exception:
        pass

    # 4. Docker Container Tracking
    active_containers = 0
    if docker:
        try:
            client = docker.from_env()
            containers = client.containers.list()
            active_containers = len(containers)
        except Exception:
            pass

    stats = {
        "server_id": SERVER_ID,
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "swap_percent": swap_percent,               # NEW
        "disk_percent": disk.percent,
        "network_in": net_in,
        "network_out": net_out,
        "uptime_seconds": int(uptime_seconds),
        "processes": active_processes,
        "os_type": os_type,               
        "arch": arch_type,                          # NEW
        "python_version": py_version,               # NEW
        "top_process": top_process_name,
        "docker_containers": active_containers   
    }
    return stats

def send_metrics(stats):
    try:
        response = requests.post(f"{BACKEND_URL}/metrics", json=stats)
        if response.status_code == 200:
            print("Metrics sent successfully:", response.json())
        else:
            print("Failed to send metrics. Status code:", response.status_code)
            print("Response:", response.text)
    except requests.exceptions.ConnectionError:
        print("Could not connect to backend. Is the server running and are you connected to Radmin VPN?")

def run_agent(interval=30):
    print(f"Sentinel Agent started. Reporting every {interval} seconds.")
    print(f"Target Backend: {BACKEND_URL} | Server ID: {SERVER_ID}")
    print("Press CTRL+C to stop.\n")

    while True:
        stats = get_system_stats()
        print("=== Collected Stats ===")
        print(stats)
        send_metrics(stats)
        print(f"Waiting {interval} seconds...\n")
        time.sleep(interval)

if __name__ == "__main__":
    run_agent(interval=30)