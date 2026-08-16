import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const port=process.env.PORT || 10000;
app.use(express.json());
app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin',process.env.CORS_ORIGIN||'*');next();});

app.get('/api/health',(req,res)=>res.json({ok:true,name:'WorldView Immersive',time:new Date().toISOString()}));

app.get('/api/earthquakes',async(req,res)=>{
  try{
    const days=Math.min(Math.max(Number(req.query.days)||7,1),30);
    const minMag=Math.min(Math.max(Number(req.query.minMagnitude)||2.5,0),9);
    const url=`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc&limit=1500&starttime=${encodeURIComponent(new Date(Date.now()-days*86400000).toISOString())}&minmagnitude=${minMag}`;
    const r=await fetch(url,{headers:{'user-agent':'WorldView-Immersive/1.0'}});
    if(!r.ok) throw new Error(`USGS ${r.status}`);
    const data=await r.json();
    const features=(data.features||[]).map(f=>({
      id:f.id,
      title:f.properties?.title||'Earthquake',
      magnitude:f.properties?.mag,
      time:f.properties?.time,
      place:f.properties?.place,
      url:f.properties?.url,
      coordinates:f.geometry?.coordinates||[]
    }));
    res.setHeader('Cache-Control','public,max-age=60');
    res.json({type:'FeatureCollection',features});
  }catch(e){res.status(502).json({error:'earthquake_feed_failed',message:e.message});}
});

app.get('/api/geocode',async(req,res)=>{
  const q=String(req.query.q||'').trim();
  if(!q) return res.status(400).json({error:'query_required'});
  try{
    const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
    const r=await fetch(url,{headers:{'user-agent':'WorldView-Immersive/1.0 contact: demo@example.com'}});
    if(!r.ok) throw new Error(`Nominatim ${r.status}`);
    const data=await r.json();
    res.setHeader('Cache-Control','public,max-age=300');
    res.json(data.map(x=>({display_name:x.display_name,lat:Number(x.lat),lon:Number(x.lon),type:x.type,category:x.category,osm_id:x.osm_id})));
  }catch(e){res.status(502).json({error:'geocode_failed',message:e.message});}
});

const dist=path.resolve(__dirname,'../dist');
app.use(express.static(dist,{index:false}));
app.get(/.*/,(req,res)=>res.sendFile(path.join(dist,'index.html')));

app.listen(port,'0.0.0.0',()=>console.log(`WorldView running on :${port}`));
