from PIL import Image
import imagehash
import os

# Load secret code from environment variable
#SECRET_CODE = os.getenv("SECRET_CODE")

# Precomputed phash of your secret MRI
# You compute this on your machine and write the integer value here
# Participants cannot reverse this to get the MRI
SECRET_IMAGE_HASH = imagehash.hex_to_hash("952e1a796a786963")

def verify_image(img_path, threshold=10):
    img = Image.open(img_path)
    img_hash = imagehash.phash(img)
    diff = SECRET_IMAGE_HASH - img_hash

    if diff <= threshold:
        print("✅ Correct MRI found!")
        print("🔐 Secret Code:", SECRET_CODE)
    else:
        print("❌ Wrong MRI. Try again!")

if __name__ == "__main__":
    img_path = input("Enter path of your MRI image: ")
    verify_image(img_path)
