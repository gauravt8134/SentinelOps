import psutil
import requests
import time

BACKEND_URL = "http://127.0.0.1:8000"
SERVER_ID = 1  # The ID of the server we're reporting metrics for

def get_system_stats():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    stats = {
        "server_id": SERVER_ID,
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "disk_percent": disk.percent,
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
        print("Could not connect to backend. Is the server running?")

def run_agent(interval=30):
    print(f"Sentinel Agent started. Reporting every {interval} seconds.")
    print(f"Monitoring server_id={SERVER_ID}, sending to {BACKEND_URL}")
    print("Press CTRL+C to stop.\n")

    while True:
        stats = get_system_stats()
        print("=== Collected Stats ===")
        print(stats)
        send_metrics(stats)
        print(f"Waiting {interval} seconds until next check...\n")
        time.sleep(interval)

if __name__ == "__main__":
    run_agent(interval=30)