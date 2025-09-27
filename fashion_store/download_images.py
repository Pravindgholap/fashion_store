import requests
import os
from urllib.parse import urlparse

# Create media directories
os.makedirs('media/categories', exist_ok=True)
os.makedirs('media/products', exist_ok=True)

# Updated Image URLs with working links
image_urls = {
    # Categories
    'categories/mens.jpg': 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&h=200&fit=crop',
    'categories/womens.jpg': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=200&fit=crop',
    'categories/kids.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop',
    'categories/footwear.jpg': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=200&fit=crop',
    'categories/accessories.jpg': 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=300&h=200&fit=crop',
    'categories/winter.jpg': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
    
    # Product Images - Fixed URLs
    # Men's T-Shirt (Product ID 1)
    'products/tshirt1.jpg': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    'products/tshirt2.jpg': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop',
    
    # Slim Fit Jeans (Product ID 2)
    'products/jeans1.jpg': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop',
    'products/jeans2.jpg': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=500&fit=crop',
    
    # Formal Shirt (Product ID 3)
    'products/shirt1.jpg': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop',
    'products/shirt2.jpg': 'https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=500&h=500&fit=crop',
    
    # Sports Jacket (Product ID 4)
    'products/jacket1.jpg': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop',
    'products/jacket2.jpg': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=500&fit=crop',
    
    # Floral Summer Dress (Product ID 5)
    'products/dress1.jpg': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop',
    'products/dress2.jpg': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=500&fit=crop',
    
    # Women's Jeans (Product ID 6) - Fixed URLs
    'products/wjeans1.jpg': 'https://images.unsplash.com/photo-1583496661160-99ec0c79e5e3?w=500&h=600&fit=crop',
    'products/wjeans2.jpg': 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500&h=600&fit=crop',
    
    # Kurti Set (Product ID 7) - Fixed URLs
    'products/kurti1.jpg': 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=500&h=600&fit=crop',
    'products/kurti2.jpg': 'https://images.unsplash.com/photo-1581044901850-ecb587851379?w=500&h=600&fit=crop',
    
    # Women's Handbag (Product ID 8)
    'products/handbag1.jpg': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop',
    'products/handbag2.jpg': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop&flip=h',
    
    # Kids T-Shirt Pack (Product ID 9) - Fixed URLs
    'products/kidstshirt1.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop',
    'products/kidstshirt2.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop&crop=faces',
    
    # School Uniform (Product ID 10) - Fixed URLs
    'products/uniform1.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop&brightness=0.9',
    'products/uniform2.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop&brightness=1.1',
    
    # Sports Shoes (Product ID 11)
    'products/shoes1.jpg': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=500&fit=crop',
    'products/shoes2.jpg': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop',
    
    # Formal Shoes (Product ID 12)
    'products/formalshoes1.jpg': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop',
    'products/formalshoes2.jpg': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=500&fit=crop',
    
    # Leather Belt (Product ID 13) - Fixed URLs
    'products/belt1.jpg': 'https://images.unsplash.com/photo-1581344981535-2330d8d28fd8?w=500&h=500&fit=crop',
    'products/belt2.jpg': 'https://images.unsplash.com/photo-1581344981408-44c7d3da1dd4?w=500&h=500&fit=crop',
    
    # Sunglasses (Product ID 14)
    'products/sunglasses1.jpg': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    'products/sunglasses2.jpg': 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500&h=500&fit=crop'
}

def download_image(url, filepath):
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            print(f"✅ Downloaded: {filepath}")
            return True
        else:
            print(f"❌ Failed to download: {url} (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Error downloading {url}: {e}")
        return False

def download_fallback_images():
    """Download fallback images for failed downloads"""
    fallback_urls = {
        # Fallback generic images
        'products/wjeans1.jpg': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop',
        'products/kurti2.jpg': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop',
        'products/kidstshirt1.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop',
        'products/kidstshirt2.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop',
        'products/uniform1.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop',
        'products/uniform2.jpg': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=500&fit=crop',
        'products/belt1.jpg': 'https://images.unsplash.com/photo-1581344981535-2330d8d28fd8?w=500&h=500&fit=crop',
        'products/belt2.jpg': 'https://images.unsplash.com/photo-1581344981408-44c7d3da1dd4?w=500&h=500&fit=crop'
    }
    
    for filepath, url in fallback_urls.items():
        full_path = f"media/{filepath}"
        if not os.path.exists(full_path):  # Only download if file doesn't exist
            download_image(url, full_path)

def main():
    print("🚀 Starting image download for Fashion Store...")
    print("=" * 50)
    
    total_images = len(image_urls)
    successful_downloads = 0
    failed_downloads = 0
    
    for filepath, url in image_urls.items():
        full_path = f"media/{filepath}"
        if download_image(url, full_path):
            successful_downloads += 1
        else:
            failed_downloads += 1
    
    # Download fallback images for failed ones
    if failed_downloads > 0:
        print("\n🔄 Downloading fallback images for failed downloads...")
        download_fallback_images()
    
    print("=" * 50)
    print(f"🎉 Download Summary:")
    print(f"📁 Total images: {total_images}")
    print(f"✅ Successful: {successful_downloads}")
    print(f"❌ Failed: {failed_downloads}")
    
    

if __name__ == "__main__":
    main()