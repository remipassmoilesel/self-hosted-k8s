#!/usr/bin/env bash

# We append 127.0.0.1 for SSH tunnels
kubeadm init --service-cidr={{ service_cidr }} \
             --pod-network-cidr={{ pod_network_cidr }} \
             --token={{ bootstrap_token }} \
             --apiserver-advertise-address={{ master_ip }} \
             --apiserver-cert-extra-sans={{ master_ip }},127.0.0.1,localhost \
             --cri-socket=unix:///run/containerd/containerd.sock \
             {{ kubeadm_init_options }}
