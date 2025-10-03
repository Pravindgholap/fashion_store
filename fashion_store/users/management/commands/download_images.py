import os
import requests
import time
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Download real fashion images for the Fashion Store'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("Fashion Store - Real Image Downloader")
        self.stdout.write("=" * 60)
        
        # Create media directories
        media_root = Path(settings.MEDIA_ROOT)
        products_dir = media_root / 'products'
        categories_dir = media_root / 'categories'

        products_dir.mkdir(parents=True, exist_ok=True)
        categories_dir.mkdir(parents=True, exist_ok=True)

        # Image mappings with direct Unsplash URLs
        IMAGES = {
            # Category Images
            'categories/mens.jpg': 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&h=1000&fit=crop',
            'categories/womens.jpg': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop',
            'categories/kids.jpg': 'https://images.unsplash.com/photo-1604917019117-619e6397023a?w=800&h=1000&fit=crop',
            'categories/footwear.jpg': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop',
            'categories/accessories.jpg': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop',
            
            # Men's Clothing
            'products/mens_shirt1.jpg': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop',
            'products/mens_shirt2.jpg': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop',
            'products/mens_jacket1.jpg': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop',
            'products/mens_pants1.jpg': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop',
            'products/mens_suit1.jpg': 'https://images.unsplash.com/photo-1594938373336-934c6c07d0b2?w=800&h=1000&fit=crop',
            
            # Women's Clothing
            'products/womens_dress1.jpg': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop',
            'products/womens_dress2.jpg': 'https://images.unsplash.com/photo-1585487000146-90694dbf8e6a?w=800&h=1000&fit=crop',
            'products/womens_top1.jpg': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=1000&fit=crop',
            'products/womens_skirt1.jpg': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop',
            'products/womens_jeans1.jpg': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1000&fit=crop',
            
            # Kids' Clothing
            'products/kids_tshirt1.jpg': 'https://images.unsplash.com/photo-1519238263530-99c7d13d26a7?w=800&h=1000&fit=crop',
            'products/kids_dress1.jpg': 'https://images.unsplash.com/photo-1594736797933-d0d69e1e8f55?w=800&h=1000&fit=crop',
            'products/kids_shorts1.jpg': 'https://images.unsplash.com/photo-1604917019117-619e6397023a?w=800&h=1000&fit=crop',
            'products/kids_jacket1.jpg': 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&h=1000&fit=crop',
            'products/kids_outfit1.jpg': 'https://images.unsplash.com/photo-1604917019117-619e6397023a?w=800&h=1000&fit=crop',
            
            # Footwear
            'products/mens_shoes1.jpg': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=1000&fit=crop',
            'products/womens_heels1.jpg': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1000&fit=crop',
            'products/sneakers1.jpg': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=1000&fit=crop',
            'products/boots1.jpg': 'https://images.unsplash.com/photo-1605818258162-6ce35d8bc7b1?w=800&h=1000&fit=crop',
            'products/sandals1.jpg': 'https://images.unsplash.com/photo-1560769684-55015cee73a8?w=800&h=1000&fit=crop',
            
            # Accessories
            'products/handbag1.jpg': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop',
            'products/watch1.jpg': 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=1000&fit=crop',
            'products/sunglasses1.jpg': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=1000&fit=crop',
            'products/belt1.jpg': 'https://images.unsplash.com/photo-1582544782661-1ae0b94bde4b?w=800&h=1000&fit=crop',
            'products/wallet1.jpg': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=1000&fit=crop',
        }
        
        self.stdout.write(f"Media directory: {media_root}")
        self.stdout.write(f"Total images to download: {len(IMAGES)}\n")
        
        success_count = 0
        failed_count = 0
        
        for filepath, url in IMAGES.items():
            if self.download_image(url, filepath):
                success_count += 1
            else:
                failed_count += 1
            
            # Small delay to avoid overwhelming the server
            time.sleep(0.5)
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"Download complete!")
        self.stdout.write(f"Success: {success_count}")
        self.stdout.write(f"Failed: {failed_count}")
        self.stdout.write("=" * 60)
        
        if success_count > 0:
            self.stdout.write(
                self.style.SUCCESS("\n✓ You can now run: python manage.py populate_demo_data")
            )

    def download_image(self, url, filepath):
        """Download a single image"""
        try:
            self.stdout.write(f"Downloading {filepath}...")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            full_path = Path(settings.MEDIA_ROOT) / filepath
            with open(full_path, 'wb') as f:
                f.write(response.content)
            
            # Verify the file was created and has content
            if full_path.stat().st_size > 1000:
                self.stdout.write(self.style.SUCCESS(f"✓ Downloaded: {filepath}"))
                return True
            else:
                os.remove(full_path)
                self.stdout.write(self.style.WARNING(f"✗ Empty file: {filepath}"))
                return False
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Failed to download {filepath}: {str(e)}"))
            return False