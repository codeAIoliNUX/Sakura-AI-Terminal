#!/bin/bash
exec > /tmp/sakura-launch.log 2>&1
cd /home/codeai/projects/sakura-terminal
exec npm start
