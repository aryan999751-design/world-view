import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {Search,Layers,LocateFixed,Compass,Activity,Globe2,ChevronDown,Info,RefreshCw,X,Menu} from 'lucide-react';
import './styles.css';

const API_BASE=import.meta.env.DEV?'http://localhost:3001':'';
function App(){
  const containerRef=useRef(null), viewerRef=useRef(null);
  const [ready,setReady]=useState(false), [error,setError]=useState('');
  const [search,setSearch]=useState(''), [results,setResults]=useState([]);
  const [layers,setLayers]=useState({earthquakes:true,borders:false,atmosphere:true});
  const bordersRef=useRef(null);
  const [quakes,setQuakes]=useState([]), [selected,setSelected]=useState(null);
  const [panel,setPanel]=useState(true), [searchOpen,setSearchOpen]=useState(true), [loading,setLoading]=useState(false);

  useEffect(()=>{
    let mounted=true;
    (async()=>{
      try{
        const token=import.meta.env.VITE_CESIUM_ION_TOKEN;
        let imagery;
        let terrain;
        if(token){
          Cesium.Ion.defaultAccessToken=token;
          imagery=await Cesium.IonImageryProvider.fromAssetId(2);
          terrain=await Cesium.createWorldTerrainAsync();
        }else{
          imagery=new Cesium.UrlTemplateImageryProvider({url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',credit:'© OpenStreetMap contributors'});
        }
        const viewer=new Cesium.Viewer(containerRef.current,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,shouldAnimate:true,baseLayer:imagery,terrainProvider:terrain});
        viewerRef.current=viewer;
        viewer.scene.globe.enableLighting=true;
        viewer.scene.skyBox.show=true;
        viewer.scene.fog.enabled=true;
        viewer.scene.postProcessStages.fxaa.enabled=true;
        viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(78.9629,22.5937,19000000),orientation:{heading:Cesium.Math.toRadians(5),pitch:Cesium.Math.toRadians(-52),roll:0}});
        viewer.screenSpaceEventHandler.setInputAction((movement)=>{const picked=viewer.scene.pick(movement.position); if(Cesium.defined(picked)&&picked.id?.properties?.earthquake){const id=picked.id.id; const q=(window.__WV_Q||[]).find(x=>x.id===id); if(q)setSelected(q);}},Cesium.ScreenSpaceEventType.LEFT_CLICK);
        mounted&&setReady(true);
      }catch(e){console.error(e);mounted&&setError(e.message||'Could not initialize the 3D globe.');}
    })();
    return()=>{mounted=false;viewerRef.current?.destroy();viewerRef.current=null;};
  },[]);

  async function loadEarthquakes(){
    setLoading(true);
    try{const r=await fetch(`${API_BASE}/api/earthquakes?days=7&minMagnitude=2.5`); const d=await r.json(); if(!r.ok)throw Error(d.message||'Feed failed'); setQuakes(d.features||[]); window.__WV_Q=d.features||[]; renderQuakes(d.features||[]);}catch(e){setError(e.message);}finally{setLoading(false);}
  }
  function renderQuakes(items){
    const viewer=viewerRef.current;if(!viewer)return;
    const collection='__wv_quakes'; const old=viewer.entities.values.filter(e=>String(e.id).startsWith(collection)); old.forEach(e=>viewer.entities.remove(e));
    for(const q of items){const [lon,lat,depth]=q.coordinates; const mag=Number(q.magnitude||0); viewer.entities.add({id:`${collection}_${q.id}`,position:Cesium.Cartesian3.fromDegrees(lon,lat,0),point:{pixelSize:Math.min(4+mag*2.1,24),color:Cesium.Color.ORANGERED.withAlpha(0.85),outlineColor:Cesium.Color.WHITE.withAlpha(0.6),outlineWidth:1,disableDepthTestDistance:Number.POSITIVE_INFINITY},label:{text:`M${mag.toFixed(1)}`,font:'11px sans-serif',fillColor:Cesium.Color.WHITE,showBackground:true,backgroundColor:Cesium.Color.BLACK.withAlpha(0.45),pixelOffset:new Cesium.Cartesian2(0,-22),disableDepthTestDistance:Number.POSITIVE_INFINITY},properties:{earthquake:true}});}
  }
  useEffect(()=>{if(ready&&layers.earthquakes)loadEarthquakes();},[ready,layers.earthquakes]);

  async function doSearch(e){e?.preventDefault(); const q=search.trim(); if(!q)return; try{const r=await fetch(`${API_BASE}/api/geocode?q=${encodeURIComponent(q)}`); const d=await r.json(); setResults(d); }catch(err){setError(err.message);}}
  function flyTo(r){const v=viewerRef.current; if(!v)return; v.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(r.lon,r.lat,250000),duration:2.4,easingFunction:Cesium.EasingFunction.QUINTIC_IN_OUT});setResults([]);}
  function resetCamera(){viewerRef.current?.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(78.9629,22.5937,19000000),duration:2.2});}
  async function toggleBorders(){
    const next=!layers.borders;
    setLayers(x=>({...x,borders:next}));
    const v=viewerRef.current;
    if(!v)return;
    if(next && !bordersRef.current){
      try{
        bordersRef.current=await Cesium.GeoJsonDataSource.load('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',{stroke:Cesium.Color.WHITE.withAlpha(.28),fill:Cesium.Color.TRANSPARENT,strokeWidth:1});
        await v.dataSources.add(bordersRef.current);
      }catch(e){setError('Could not load border layer: '+e.message);setLayers(x=>({...x,borders:false}));}
    }else if(!next && bordersRef.current){
      v.dataSources.remove(bordersRef.current,true);
      bordersRef.current=null;
    }
  }
  function toggle(k){setLayers(x=>({...x,[k]:!x[k]}));}
  const count=quakes.length;
  return <div className="app">
    <div ref={containerRef} className="globe" />
    <div className="vignette" />
    <header className="topbar">
      <div className="brand"><div className="brandMark"><Globe2 size={18}/></div><div><div className="brandTitle">WORLDVIEW</div><div className="brandSub">IMMERSIVE SPATIAL INTELLIGENCE</div></div></div>
      <form onSubmit={doSearch} className="searchBox"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search the world…"/><button type="submit">GO</button></form>
      <div className="status"><span className="dot"></span> LIVE <span className="sep">•</span> {new Date().toISOString().slice(11,19)}Z</div>
    </header>
    <div className="leftRail">
      <button className="railBtn" onClick={()=>setPanel(p=>!p)} title="Toggle panel"><Menu size={18}/></button>
      <button className="railBtn" onClick={resetCamera} title="Reset view"><LocateFixed size={18}/></button>
      <button className="railBtn" onClick={()=>viewerRef.current?.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)} title="Free camera"><Compass size={18}/></button>
    </div>
    {panel&&<aside className="panel">
      <div className="panelHeader"><div><div className="eyebrow">WORLD STATUS</div><h2>Live layers</h2></div><button className="iconBtn" onClick={()=>setPanel(false)}><X size={16}/></button></div>
      <div className="metric"><span>DATA STREAMS</span><strong>04</strong></div>
      <div className="metric"><span>EARTHQUAKES · 7D</span><strong>{count||'—'}</strong></div>
      <div className="metric"><span>GLOBE ENGINE</span><strong>{ready?'READY':'LOADING'}</strong></div>
      <div className="layersHeader"><Layers size={15}/> LAYERS</div>
      <Layer label="Earthquakes" on={layers.earthquakes} onClick={()=>toggle('earthquakes')} accent="orange"/>
      <Layer label="Atmosphere" on={layers.atmosphere} onClick={()=>{toggle('atmosphere'); if(viewerRef.current)viewerRef.current.scene.skyAtmosphere.show=!layers.atmosphere;}}/>
      <Layer label="Borders" on={layers.borders} onClick={toggleBorders}/>
      <button className="refresh" onClick={loadEarthquakes} disabled={loading}><RefreshCw size={14} className={loading?'spin':''}/> {loading?'REFRESHING':'REFRESH LIVE DATA'}</button>
      <div className="source"><Info size={13}/><span>Earthquake feed: USGS. Search: OpenStreetMap Nominatim.</span></div>
    </aside>}
    {searchOpen&&results.length>0&&<div className="searchResults">{results.map((r,i)=><button key={i} onClick={()=>flyTo(r)}><div className="resultName">{r.display_name}</div><div className="resultMeta">{r.type} · {r.lat.toFixed(3)}, {r.lon.toFixed(3)}</div></button>)}</div>}
    {selected&&<div className="eventCard"><div className="eventTop"><div className="eyebrow">SEISMIC EVENT</div><button className="iconBtn" onClick={()=>setSelected(null)}><X size={15}/></button></div><div className="eventMag">M {Number(selected.magnitude).toFixed(1)}</div><div className="eventPlace">{selected.place}</div><div className="eventMeta">{new Date(selected.time).toUTCString()}</div><a href={selected.url} target="_blank" rel="noreferrer">Open USGS event ↗</a></div>}
    {error&&<div className="errorToast"><span>{error}</span><button onClick={()=>setError('')}>×</button></div>}
    <footer className="footer"><div>WORLDVIEW / REAL DATA / WEBGL</div><div>© 2026 ORIGINAL IMPLEMENTATION</div></footer>
  </div>
}
function Layer({label,on,onClick,accent}){return <button className="layer" onClick={onClick}><span className={`switch ${on?'on':''} ${accent||''}`}><span/></span><span>{label}</span><ChevronDown size={14} className="chev"/></button>}

createRoot(document.getElementById('root')).render(<App/>);
