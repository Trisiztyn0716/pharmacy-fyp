# Pharmacy MVC + DailyMed Starter

This is a small MVC starter system for an FYP pharmacy management website.

It includes:

- Express.js MVC structure
- EJS web pages
- PostgreSQL database schema
- Medicine inventory table
- Supplier table
- Sales table
- External medicine information cache table
- DailyMed API service
- Search route for medicine information
- Customer/staff login with role-protected staff dashboard
- Customer registration and email-verified staff registration
- Staff inventory image selection, editing and deletion
- Customer storefront product images and product search
- Staff image uploads from File Explorer or drag-and-drop
- Customer purchase requests and staff web sales dashboard

## Important FYP Scope

This project does **not** build a full medicine knowledge database from scratch.

Instead:

- Local database stores pharmacy-specific data:
  - medicine name
  - brand
  - category
  - stock quantity
  - import price
  - selling price
  - expiry date
  - supplier
  - sales

- DailyMed is used as an external public source for general medicine label information:
  - title
  - drug label ID / SETID
  - official source URL
  - label metadata

This is more realistic for an undergraduate FYP and easier to finish on time.

---

## 1. Open in VS Code

Extract this folder, then open it in Visual Studio Code.

Open VS Code terminal inside the project folder.

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create your PostgreSQL database

Open pgAdmin or PostgreSQL terminal and create a database named:

```sql
CREATE DATABASE pharmacy_db;
```

---

## 4. Create `.env`

Copy `.env.example` and rename it to `.env`.

Then update your PostgreSQL password:

```env
DB_PASSWORD=your_real_password_here
AUTH_SESSION_SECRET=replace_with_a_long_random_secret
STAFF_ALLOWED_EMAIL_DOMAIN=yourpharmacy.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
MAIL_FROM=Pharmacy Portal <your_email@gmail.com>
```

`SMTP_*` configuration is required for registration because sign-up notifications and staff verification codes are sent to the entered email address. For Gmail, use an app password rather than the account password.

Set `STAFF_ALLOWED_EMAIL_DOMAIN` to the pharmacy's controlled email domain before deployment. In production mode, staff registration is disabled until this value is configured. Email verification confirms ownership of an address; restricting the domain or adding administrator approval is still necessary to establish that a person is authorised staff.

---

## 5. Run database schema

In VS Code terminal:

```bash
psql -U postgres -d pharmacy_db -f database/schema.sql
```

If `psql` is not recognized on Windows, use the full path, for example:

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d pharmacy_db -f database/schema.sql
```

---

## 6. Add sample data

```bash
psql -U postgres -d pharmacy_db -f database/seed.sql
```

Or with full path on Windows:

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d pharmacy_db -f database/seed.sql
```

---

## 7. Upgrade an existing database for login

If you already initialized and populated the database before the login and registration features were added, do not rerun `schema.sql` because it drops current tables. Add authentication and pending staff verification tables without removing existing inventory:

```bash
npm run db:add-auth
```

---

## 8. Upgrade an existing database for medicine images

If your database already contains inventory, add image support without dropping products:

```bash
npm run db:add-medicine-images
```

This migration associates the included images with the existing `Ibuprofen`, `Acetaminophen`, `Amoxicillin`, and `Paracetamol 500mg` rows when those products exist.

Place medicine image files in:

```text
src/public/images/medicines
```

Staff can then select an image when adding or editing a medicine. The selected image is shown in staff inventory and on the customer storefront.

---

## 9. Upgrade an existing database for customer purchases

If your database already exists, add the customer purchase tables without dropping current inventory:

```bash
npm run db:add-purchases
```

Customer purchases store the selected medicine, quantity, customer name, phone, delivery address, payment method, subtotal, and order status. Card payments store only the chosen payment method; the app does not collect or store card numbers.

---

## 10. Start the system

```bash
npm run dev
```

Then open:

```text
http://localhost:8080/login
```

## 11. Test customer and staff login

The seed file provides two development accounts:

| Account type | Email | Password | Destination |
| --- | --- | --- | --- |
| Staff | `staff@pharmacy.local` | `Staff123!` | `/staff` inventory dashboard |
| Customer | `customer@pharmacy.local` | `Customer123!` | `/user/home` customer landing page |

The staff dashboard, inventory creation, and staff search routes require a signed-in staff account. A customer account receives an access-denied page if it tries to open those routes.

---

## 12. Test registration

On the login page, choose either `Basic User` or `Staff` under the sign-in button.

- A basic user account is created after its confirmation email is sent, then the browser returns to the customer login.
- A staff registration sends a six-digit code to the entered address. The account is created only after the code is entered successfully, then a confirmation email is sent and the browser returns to staff login.
- Staff verification codes expire in 10 minutes and allow five unsuccessful attempts.

---

## 13. Test DailyMed medicine search

Browser/API test:

```text
http://localhost:8080/api/medicine-info/ibuprofen
```

Try also:

```text
http://localhost:8080/api/medicine-info/acetaminophen
http://localhost:8080/api/medicine-info/amoxicillin
```

Note: DailyMed is a U.S. source, so some Vietnamese medicine names may not appear. Search by generic ingredient names when possible.

---

## Suggested thesis wording

"The system stores pharmacy-specific operational data locally, including stock, price, supplier, expiry date, sales, and customer-related transactions. General medicine label information is not manually created from scratch. Instead, the system retrieves public drug-label data from DailyMed and caches selected fields in the local database. This approach reduces development time, improves maintainability, and ensures the information layer is based on a trusted public source."

---

## Safety disclaimer for the app

Use this disclaimer in your UI:

"This medicine information is for general reference only and is not medical advice. Please consult a licensed pharmacist or doctor before using any medicine."
