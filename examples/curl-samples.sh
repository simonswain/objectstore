#!/bin/bash

curl -i -X POST -H "Content-type: application/json" localhost:8002/objects -d '{"type": "doc"}'
