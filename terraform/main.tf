terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.34.0"
    }
  }
}

locals {
  project = "sesnsory-minds"
}

provider "google" {
  project = local.project
  region  = "europe-west1"
}

resource "google_storage_bucket" "changes-tracker" {
  name                        = "changes-tracker-gcf-source"
  location                    = "EU"
  uniform_bucket_level_access = true
}

resource "google_storage_bucket" "previous-state" {
  name                        = "changes-tracker-previous-state"
  location                    = "europe-west1"
  uniform_bucket_level_access = true
  force_destroy               = true
}

resource "google_storage_bucket_iam_member" "all_users_object_viewer" {
  bucket = google_storage_bucket.previous-state.name
  role   = "roles/storage.objectAdmin"
  member = "allUsers"
}

data "archive_file" "default" {
  type        = "zip"
  output_path = "/tmp/function-source.zip"
  source_dir  = "../dist"
}

resource "google_storage_bucket_object" "object" {
  name   = "function-source.zip"
  bucket = google_storage_bucket.changes-tracker.name
  source = data.archive_file.default.output_path
}

resource "google_pubsub_topic" "website-changes-tracker" {
  name = "website-changes-tracker"
}

resource "google_cloud_scheduler_job" "website-changes-tracker-job" {
  name        = "website-changes-tracker-job"
  schedule    = "0 12 * * *"
  description = "executes website state check"
  pubsub_target {
    topic_name = google_pubsub_topic.website-changes-tracker.id
    data       = base64encode("time to sync")
  }
  depends_on = [
    google_pubsub_topic.website-changes-tracker
  ]
}

resource "google_cloudfunctions2_function" "website-changes-tracker" {
  name     = "website-changes-tracker"
  location = "europe-west1"

  build_config {
    runtime     = "nodejs16"
    entry_point = "trackUrlChanges"
    source {
      storage_source {
        bucket = google_storage_bucket.changes-tracker.name
        object = google_storage_bucket_object.object.name
      }
    }

  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    environment_variables = {
      WEBSITES            = "https://www.sensory-minds.com/,https://www.google.com/"
      TWILIO_PHONE_NUMBER = "+18145815019"
      MY_NUMBER           = "+48792698713"
      BUCKET_NAME              = "changes-tracker-previous-state"
    }

    secret_environment_variables {
      key        = "SPREADSHEET_ID"
      project_id = local.project
      secret     = "SPREADSHEET_ID"
      version    = "latest"
    }

    secret_environment_variables {
      key        = "SERVICE_ACCOUNT_PRIVATE_KEY"
      project_id = local.project
      secret     = "SERVICE_ACCOUNT_PRIVATE_KEY"
      version    = "latest"
    }

    secret_environment_variables {
      key        = "SERVICE_ACCOUNT_EMAIL"
      project_id = local.project
      secret     = "SERVICE_ACCOUNT_EMAIL"
      version    = "latest"
    }

    secret_environment_variables {
      key        = "TWILIO_ACCOUNT_SID"
      project_id = local.project
      secret     = "TWILIO_ACCOUNT_SID"
      version    = "latest"
    }

    secret_environment_variables {
      key        = "TWILIO_AUTH_TOKEN"
      project_id = local.project
      secret     = "TWILIO_AUTH_TOKEN"
      version    = "latest"
    }
  }

  event_trigger {
    trigger_region = "europe-west1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.website-changes-tracker.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}
