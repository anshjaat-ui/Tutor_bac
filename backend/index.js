import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
dotenv.config()
const app=express(), port=process.env.PORT||4000
const root=path.dirname(fileURLToPath(import.meta.url)), dataDir=path.join(root,'data')
const files={enquiries:path.join(dataDir,'enquiries.json'),subjects:path.join(dataDir,'subjects.json'),banners:path.join(dataDir,'banners.json')}
app.use(cors({origin:(process.env.CLIENT_ORIGIN||'http://localhost:5173').split(','),credentials:true}));app.use(express.json({limit:'1mb'}))
async function read(key,fallback){try{return JSON.parse(await fs.readFile(files[key],'utf8'))}catch{return fallback}}
async function save(key,data){await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(files[key],JSON.stringify(data,null,2));return data}
const requireAdmin=(req,res,next)=>{const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');try{req.admin=jwt.verify(token,process.env.JWT_SECRET||'dev-only-change-me');next()}catch{return res.status(401).json({error:'Admin sign-in required'})}}
app.get('/api/health',(req,res)=>res.json({ok:true,service:'Alpha Home Tutors API'}))
app.post('/api/login',(req,res)=>{if(!process.env.ADMIN_PASSWORD||!process.env.JWT_SECRET)return res.status(503).json({error:'Set ADMIN_PASSWORD and JWT_SECRET in server/.env first'});if(req.body?.password!==process.env.ADMIN_PASSWORD)return res.status(401).json({error:'Incorrect password'});res.json({token:jwt.sign({role:'admin'},process.env.JWT_SECRET,{expiresIn:'12h'})})})
app.post('/api/enquiries',async(req,res)=>{const {name,phone,classLevel,subject}=req.body||{};if(!name||!phone||!classLevel||!subject)return res.status(400).json({error:'Name, phone, class and subject are required'});const rows=await read('enquiries',[]);const item={...req.body,id:Date.now().toString(),status:'New',createdAt:new Date().toISOString()};rows.unshift(item);await save('enquiries',rows);res.status(201).json(item)})
app.get('/api/enquiries',requireAdmin,async(req,res)=>res.json(await read('enquiries',[])))
app.patch('/api/enquiries/:id',requireAdmin,async(req,res)=>{const rows=await read('enquiries',[]),idx=rows.findIndex(x=>String(x.id)===req.params.id);if(idx<0)return res.status(404).json({error:'Enquiry not found'});rows[idx]={...rows[idx],...req.body,id:rows[idx].id};await save('enquiries',rows);res.json(rows[idx])})
app.delete('/api/enquiries/:id',requireAdmin,async(req,res)=>{const rows=await read('enquiries',[]),next=rows.filter(x=>String(x.id)!==req.params.id);await save('enquiries',next);res.json({ok:true})})
app.get('/api/subjects',async(req,res)=>res.json(await read('subjects',['Mathematics','Science','English','Hindi','Social Science','Physics','Chemistry','Biology','Commerce','Computer'])))
app.put('/api/subjects',requireAdmin,async(req,res)=>{if(!Array.isArray(req.body?.subjects))return res.status(400).json({error:'subjects must be an array'});res.json(await save('subjects',req.body.subjects.map(String).filter(Boolean)))})
app.get('/api/banners',async(req,res)=>res.json(await read('banners',[{id:'default',title:'Every student can learn better.',subtitle:'Personalized home tuition support',active:true}])))
app.put('/api/banners',requireAdmin,async(req,res)=>{if(!Array.isArray(req.body?.banners))return res.status(400).json({error:'banners must be an array'});res.json(await save('banners',req.body.banners))})
app.listen(port,()=>console.log(`Alpha Home Tutors API running on http://localhost:${port}`))
