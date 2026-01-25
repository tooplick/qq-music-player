import asyncio
from qqmusic_api import search, lyric
from qqmusic_api.search import SearchType

async def main():
    # Search for 十面埋伏
    print("Searching for 十面埋伏...")
    results = await search.search_by_type("十面埋伏", search_type=SearchType.SONG, num=5)
    
    print(f"Results type: {type(results)}")
    
    if not results:
        print("No results found")
        return
    
    # Handle list response
    if isinstance(results, list):
        song = results[0]
    else:
        song = results['list'][0] if results.get('list') else results[0]
    
    song_mid = song.get('mid') or song.get('songmid')
    song_name = song.get('name') or song.get('songname')
    print(f"\nFound: {song_name} (mid: {song_mid})")
    
    # Get lyrics with trans and roma
    print("\nFetching lyrics with trans=True, roma=True...")
    lyrics_data = await lyric.get_lyric(song_mid, trans=True, roma=True)
    
    print(f"\n=== LYRIC (first 500 chars) ===")
    lyric_text = lyrics_data.get('lyric', '')
    print(lyric_text[:500] if lyric_text else "(empty)")
    
    print(f"\n=== TRANS (first 500 chars) ===")
    trans_text = lyrics_data.get('trans', '')
    print(trans_text[:500] if trans_text else "(empty)")
    
    print(f"\n=== ROMA (first 500 chars) ===")
    roma_text = lyrics_data.get('roma', '')
    print(roma_text[:500] if roma_text else "(empty)")
    
    print(f"\n=== LENGTHS ===")
    print(f"lyric: {len(lyric_text)} chars")
    print(f"trans: {len(trans_text)} chars")
    print(f"roma: {len(roma_text)} chars")

if __name__ == "__main__":
    asyncio.run(main())
