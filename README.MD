📋 API Endpoints

| Method | Endpoint  | Description
| -------|-----------|-------------
| GET    | /api/docs | Get all categorized data
| GET    | /api/docs/stats | Get all payment statistics
| GET    | /api/docs/refresh | Get refreshed data from Google Sheets
| GET    | /api/docs/category/:category | Get data for specific | category
| GET    | /api/docs/search?{filed}=XXX | Search fileds [ transactionId, category, teamName, teamLead, email, phone, institution, paymentMethod ]
| GET    | /api/docs/duplicates | Get duplicate transactions report
| POST   | /api/email/send | Send single transaction email
| POST   | /api/email/send-bulk | Send multiple emails
| GET    | /api/email/history | Get email sending history