[
  {
    "id": "deploy-productivity-app",
    "execute-command": "/opt/productivity-app/deploy.sh",
    "command-working-directory": "/opt/productivity-app",
    "pass-arguments-to-command": [],
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "value",
            "value": "POST",
            "parameter": {
              "source": "method",
              "name": ""
            }
          }
        },
        {
          "match": {
            "type": "payload-hmac-sha256",
            "secret": "${WEBHOOK_SECRET}",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        }
      ]
    }
  }
]
