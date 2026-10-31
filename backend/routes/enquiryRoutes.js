import express from 'express'
import Enquiry from '../models/Enquiry.js'
import { protect, admin } from '../middleware/authMiddleware.js'
const router=express.Router()
// Public student/parent enquiry submission
router.post('/',async(req,res)=>{
  const {name,phone,classLevel,subjects=[],area,mode='Home tuition',message=''}=req.body||{}
  if(!name||String(name).trim().length<2||!/^([6-9]\d{9})$/.test(String(phone||''))||!classLevel||!area){return res.status(400).json({message:'Please provide a valid name, 10-digit phone number, class and location.'})}
  if(!Array.isArray(subjects)||subjects.length>20)return res.status(400).json({message:'Invalid subjects list.'})
  const enquiry=await Enquiry.create({name,phone,classLevel,subjects:subjects.map(s=>String(s).slice(0,60)),area,mode,message:String(message).slice(0,1500)})
  res.status(201).json({message:'Enquiry submitted successfully',enquiryId:enquiry._id})
})
// All management endpoints require a logged-in admin
router.get('/',protect,admin,async(req,res)=>{const {status,search}=req.query;const filter={};if(status&&status!=='All')filter.status=status;if(search){filter.$or=[{name:{$regex:search,$options:'i'}},{phone:{$regex:search,$options:'i'}},{area:{$regex:search,$options:'i'}}]}const enquiries=await Enquiry.find(filter).sort({createdAt:-1}).limit(500);res.json(enquiries)})
router.patch('/:id',protect,admin,async(req,res)=>{const allowed=['status','adminNote'];const update={};for(const key of allowed)if(req.body[key]!==undefined)update[key]=req.body[key];if(update.status&&!['New','Contacted','Demo Scheduled','Converted','Rejected'].includes(update.status))return res.status(400).json({message:'Invalid status'});const item=await Enquiry.findByIdAndUpdate(req.params.id,update,{new:true,runValidators:true});if(!item)return res.status(404).json({message:'Enquiry not found'});res.json(item)})
router.delete('/:id',protect,admin,async(req,res)=>{const item=await Enquiry.findByIdAndDelete(req.params.id);if(!item)return res.status(404).json({message:'Enquiry not found'});res.json({message:'Enquiry deleted'})})
export default router
