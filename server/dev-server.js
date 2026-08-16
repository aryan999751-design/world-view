import express from 'express';
const app=express(); const port=3001;
app.get('/api/health',(req,res)=>res.json({ok:true}));
app.listen(port,'127.0.0.1',()=>console.log(`Dev API on :${port}`));
