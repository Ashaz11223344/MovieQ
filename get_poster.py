import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def get_imdb_poster(imdb_id, download=False):
    """
    Fetches the movie poster and details using an IMDb ID (e.g. 'tt0137523' or '0137523').
    Requires NO API keys.
    """
    clean_id = imdb_id.strip()
    if not clean_id.startswith('tt'):
        clean_id = f"tt{clean_id}"

    url = f"https://v3.sg.media-imdb.com/suggestion/x/{clean_id}.json"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            items = data.get('d', [])
            if not items:
                print(f"❌ No results found for IMDb ID: {imdb_id}")
                return None

            movie = items[0]
            title = movie.get('l', 'Unknown Title')
            year = movie.get('y', 'Unknown Year')
            cast = movie.get('s', 'N/A')
            image_info = movie.get('i', {})
            poster_url = image_info.get('imageUrl')

            if not poster_url:
                print(f"⚠️ Movie '{title}' ({year}) was found, but no poster image is listed.")
                return None

            print(f"🎬 Title:  {title} ({year})")
            print(f"🎭 Cast:   {cast}")
            print(f"🖼️ Poster: {poster_url}")

            if download:
                filename = f"{clean_id}_{title.replace(' ', '_').replace(':', '')}.jpg"
                img_req = urllib.request.Request(poster_url, headers=headers)
                with urllib.request.urlopen(img_req) as img_resp, open(filename, 'wb') as f:
                    f.write(img_resp.read())
                print(f"💾 Downloaded poster as: {filename}")

            return poster_url

    except urllib.error.URLError as e:
        print(f"❌ Network or HTTP error: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python get_poster.py <IMDB_ID> [--download]")
        print("Example: python get_poster.py tt0137523 --download")
        sys.exit(1)

    imdb_id = sys.argv[1]
    download_flag = '--download' in sys.argv or '-d' in sys.argv
    get_imdb_poster(imdb_id, download=download_flag)
