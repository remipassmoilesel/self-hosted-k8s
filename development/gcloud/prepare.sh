#!/usr/bin/env bash

# This script will be executed on each Compute Engine machine after bootstrap

# CHANGE ME
PASSWORD="d68b5367fa0a9452de936a22482404e123e52"

set -x

# Upgrade system
sudo apt-get update && sudo apt-get upgrade -y

# Install helpers
sudo apt-get update && sudo apt-get install -y vim net-tools sed curl wget byobu ranger

# Change default passwords
echo "root:$PASSWORD" | sudo chpasswd
echo "ubuntu:$PASSWORD" | sudo chpasswd

# Configure SSH
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

sudo sed -i -E 's/#?PermitRootLogin.+/PermitRootLogin yes/g' /etc/ssh/sshd_config
sudo sed -i -E 's/#?PasswordAuthentication.+/PasswordAuthentication yes/g' /etc/ssh/sshd_config
sudo sed -i -E 's/#?UsePAM.+/UsePAM no/g' /etc/ssh/sshd_config

sudo systemctl restart ssh
