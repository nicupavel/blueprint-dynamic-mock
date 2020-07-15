FORMAT: X-1A

HOST: https://device.ip:8080/api/4/

# Blueprint Dynamic Mock Example API
This is just an example for parsing API in blueprint format

## GET /apiVer
Returns the software, hardware and api level versions.

+ Response 200 (application/json)

        {
            "apiVer": "4.3.0",
            "hwVer": 2,
            "swVer": "4.0.840"
        }


##/diag
###GET
Returns software and device diagnostics.

+ Response 200 (application/json)

            {
              "hasWifi": true,
              "uptime": "2 days, 22:33:59",
              "memUsage": 11992,
              "networkStatus": true,
              "bootCompleted": true,
              "lastCheckTimestamp": 1433409727,
              "wizardHasRun": true,
              "standaloneMode": false,
              "cpuUsage": 3.0,
              "lastCheck": "2015-06-04 02:22:07",
              "softwareVersion": "4.0.535",
              "timeStatus": true,
              "locationStatus": true,
              "wifiMode": "managed",
              "gatewayAddress": "192.168.12.1",
              "internetStatus": true,
              "cloudStatus": 0,
              "weatherStatus": true
            }

## /machine/time
### GET
Returns the time on machine in format ``YYYY-MM-DD HH:MM:SS``

+ Response 200 (application/json)

        {
            "appDate": "2015-06-04 02:33:17"
        }
