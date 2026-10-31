# amazon-clone-backend — Step 2 (Real Backend)

Node.js + Express + MongoDB backend. Auth (JWT), Products, Cart, Orders,
aur Razorpay payment integration.

## Local setup

1. `.env.example` ko copy karke `.env` banao:
   ```
   cp .env.example .env
   ```
2. `.env` mein values bharo:
   - **MONGO_URI**: MongoDB Atlas se free cluster banao (https://www.mongodb.com/cloud/atlas)
     → Database Access mein user banao → Network Access mein `0.0.0.0/0` allow karo (ya apna IP)
     → Connect → Drivers → connection string copy karo.
   - **JWT_SECRET**: koi bhi random 32+ character string.
   - **RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET**: https://dashboard.razorpay.com/app/keys
     (test mode keys se shuru karo, live jaane se pehle KYC complete karna hoga)
3. Install & run:
   ```
   npm install
   npm run dev
   ```
4. Sample products daalne ke liye: `npm run seed`
5. API `http://localhost:5000` pe chalega.

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | - | Naya user banao |
| POST | /api/auth/login | - | Login, JWT token milega |
| GET | /api/auth/profile | Yes | Apna profile dekho |
| GET | /api/products | - | Products list (search/filter/pagination) |
| GET | /api/products/:id | - | Single product |
| POST | /api/products | Admin | Naya product add karo |
| PUT | /api/products/:id | Admin | Product update karo |
| DELETE | /api/products/:id | Admin | Product delete karo |
| POST | /api/products/:id/reviews | Yes | Review add karo |
| GET | /api/cart | Yes | Apna cart dekho |
| POST | /api/cart | Yes | Cart mein item add karo |
| PUT | /api/cart/:productId | Yes | Cart item qty update karo |
| DELETE | /api/cart/:productId | Yes | Cart se item hatao |
| POST | /api/orders | Yes | Order + Razorpay order banao |
| POST | /api/orders/verify | Yes | Payment verify karo (signature check) |
| GET | /api/orders/my | Yes | Apne orders dekho |
| GET | /api/orders/:id | Yes | Single order dekho |
| GET | /api/orders | Admin | Sab orders dekho |
| PUT | /api/orders/:id/status | Admin | Order status update karo |

## Admin user kaise banao

Signup ke baad, MongoDB Atlas ke "Browse Collections" mein jaake us user ke
document mein `role: "customer"` ko `role: "admin"` kar do. Baad mein isके liye
proper admin-invite flow bana sakte ho.

## Deployment (Render — free tier)

1. Is backend folder ko apne GitHub repo mein push karo.
2. https://render.com pe "New Web Service" → apna GitHub repo connect karo.
3. Build command: `npm install` | Start command: `npm start`
4. Environment tab mein `.env` ki saari values daalo.
5. Deploy hone ke baad tumhe URL milega jaise `https://your-app.onrender.com`
6. Frontend (Vercel) ke env variable mein ye backend URL daal do (agla step mein batata hoon).

## Payment flow (Razorpay) — kaise kaam karta hai

1. Frontend checkout pe `POST /api/orders` call karta hai (cart items + address).
2. Backend prices ko database se verify karta hai (frontend ka price kabhi trust nahi karta —
   security ke liye zaroori hai), phir Razorpay order banata hai.
3. Frontend ko `razorpayOrderId` aur `key` milta hai, jisse Razorpay Checkout popup khulta hai.
4. Payment hone ke baad Razorpay se `razorpay_payment_id` aur `razorpay_signature` milta hai.
5. Frontend `POST /api/orders/verify` call karta hai — backend signature ko
   apne secret key se verify karta hai. Tabhi order ko "paid" mark kiya jaata hai.

Ye step (signature verification) skip mat karna — isके bina koi bhi client
side se fake "payment successful" bol sakta hai.

## Payment flow — Direct UPI (Razorpay ki jagah)

Ab Razorpay nahi, seedha UPI use ho raha hai:

1. Frontend checkout pe `POST /api/orders` call karta hai (cart items + address).
2. Backend prices ko database se verify karta hai, order banata hai, aur ek UPI
   deep link + QR code image URL return karta hai.
3. Customer QR scan karke apne UPI app (GPay/PhonePe/Paytm) se pay karta hai.
4. Customer "I've Paid" dabata hai → `PUT /api/orders/:id/claim-payment` call
   hota hai. Ye sirf ek CLAIM hai, automatic verification nahi hai.
5. Customer WhatsApp button se tumhe (admin) turant order details bhej sakta hai.
6. **Tumhe manually apna bank/UPI app check karke** confirm karna hoga ki paisa
   aaya. Admin panel se (ya seedha API se) `PUT /api/orders/:id/confirm-payment`
   call karo — tabhi order "paid" mark hoga, stock kam hoga, cart clear hoga.

⚠️ Ye approach chhote/personal projects ke liye theek hai (jahan tum khud order
verify kar sakte ho), lekin scale karne pe automatic payment gateway (Razorpay/
Cashfree/PayU) better rahega — kyunki manual verification mein galti ya delay
ho sakta hai.

### `.env` mein UPI values

```
UPI_ID=yourname@okaxis
UPI_NAME=Your Name Or Store Name
WHATSAPP_NUMBER=91XXXXXXXXXX
```
