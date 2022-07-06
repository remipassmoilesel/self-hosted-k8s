#!/usr/bin/env bash

kubeadm join --token {{ bootstrap_token }} \
             --discovery-token-unsafe-skip-ca-verification \
             --cri-socket=unix:///run/containerd/containerd.sock \
             {{ master_ip }}:6443
