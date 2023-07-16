# sensoryMindsTest

A package to monitor changes of defined websites, send notifications save monitoring history.

In current implementation it keeps the previous request in the bucket (file name is domain name of th request's url), and compares the current request with the previous one. If there is a difference, it sends an sms to the user and add data to spreadsheet.

It monitors the following changes:

- http status code
- response time
- response body

If difference in response body more than 2000 characters, it doesn't send it to spreadsheet.

It designed to be run on Google Cloud Functions, but can be used locally as well.
The GCP architecture is the following:
Cloud Scheduler -> Cloud Pub/Sub -> Cloud Functions

You can use Terraform to create the infrastructure.
You can also edit Terraform files to change the frequency of the scheduler (now it is set to run every day at 12:00)
Scheduler can be also triggered manually from the GCP console.

!IMPORTANT! You need to create a service account with the Editor role (of course it be narrowed down to the minimum required permissions) and download the json file with the private key. You need to add the private key and the email of the service account to the .env file.
You need to create secrets in the GCP Secret Manager with the same names as in the .env file and add the values from the .env file to the secrets.
Also you need to create a spreadsheet and add service account to the list of editors.

## Installation

copy .env.example file to .env and fill it with your data

```bash
yarn install
tsc
cd terraform
terraform init
terraform apply
```

If you want to use it locally without GCP, edit the index.ts file (add trackUrlChanges() call) and run:

```bash
ts-node src/index.ts
```

ENV variables:

```bash
SPREADSHEET_ID = id of the spreadsheet to save monitoring history (take it from the url)
SERVICE_ACCOUNT_PRIVATE_KEY = private key of the Google Cloud service account (take it from the json file)
SERVICE_ACCOUNT_EMAIL = email of the Google Cloud service account (take it from the json file)
TWILIO_ACCOUNT_SID = twilio account sid
TWILIO_AUTH_TOKEN = twilio auth token
TWILIO_PHONE_NUMBER = twilio phone number
BUCKET_NAME = name of the bucket to save previous requests

WEBSITES = add coma-separated websites to monitor
MY_NUMBER - your phone number to receive sms notifications
```

workaround for such primitive terraform implementation of GCP function deployment:
copy package.json to src folder

# REMOVAL

```bash
cd terraform
terraform destroy
```
