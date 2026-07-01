import os
import zipfile
import shutil

def setup_project():
    base_dir = r"c:\Stock Market"
    
    # Define directories to create
    dirs = [
        os.path.join(base_dir, "data", "raw"),
        os.path.join(base_dir, "data", "processed"),
        os.path.join(base_dir, "scripts"),
        os.path.join(base_dir, "sql"),
        os.path.join(base_dir, "powerbi", "mockups"),
        os.path.join(base_dir, "notebooks", "images")
    ]
    
    print("Creating project directories...")
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        print(f"Created: {d}")
        
    zip_path = os.path.join(base_dir, "archive.zip")
    raw_dir = os.path.join(base_dir, "data", "raw")
    
    if os.path.exists(zip_path):
        print(f"Extracting {zip_path} to {raw_dir}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(raw_dir)
        print("Extraction complete.")
    else:
        print(f"Error: {zip_path} not found.")
        
    # Clean up metadata.json from root if it exists (move to raw or just remove and let it be in raw)
    root_metadata = os.path.join(base_dir, "metadata.json")
    if os.path.exists(root_metadata):
        dest_metadata = os.path.join(raw_dir, "metadata.json")
        if not os.path.exists(dest_metadata):
            shutil.move(root_metadata, dest_metadata)
            print(f"Moved root metadata.json to {dest_metadata}")
        else:
            os.remove(root_metadata)
            print("Removed redundant root metadata.json")

if __name__ == "__main__":
    setup_project()
