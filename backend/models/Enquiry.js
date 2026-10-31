import mongoose from 'mongoose'
const enquirySchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:100},
  phone:{type:String,required:true,match:/^[6-9]\d{9}$/},
  classLevel:{type:String,required:true,trim:true},
  subjects:{type:[String],default:[]},
  area:{type:String,required:true,trim:true},
  mode:{type:String,default:'Home tuition'},
  message:{type:String,default:'',maxlength:1500},
  source:{type:String,default:'website'},
  status:{type:String,enum:['New','Contacted','Demo Scheduled','Converted','Rejected'],default:'New'},
  adminNote:{type:String,default:''}
},{timestamps:true})
export default mongoose.model('Enquiry',enquirySchema)
