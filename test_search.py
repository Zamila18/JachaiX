import requests
import json

r = requests.post('http://localhost:5002/search', json={
    'query': 'AI generated fake image SSC exam student feet Bangladesh social media',
    'top_k': 5
})
data = r.json()
print(f"Total results: {data['total']}")
for x in data['results']:
    print(f"  score={x['score']:.4f} | {x.get('source','')} | {x.get('title','')[:60]}")
