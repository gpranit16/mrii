from PIL import Image
import imagehash

# Path to your secret MRI image
img_path = "dataset/tumor.jpg"  # change this to your actual MRI file name

# Open and resize the image (important for consistent hashing)
img = Image.open(img_path).resize((256, 256))

# Compute perceptual hash (phash)
hash_value = imagehash.phash(img)

# Print hash
print("Your MRI phash (hex string):", str(hash_value))
