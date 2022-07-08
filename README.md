# Self-hosted Kubernetes cluster

![GitHub Repo stars](https://img.shields.io/github/stars/remipassmoilesel/self-hosted-k8s?style=social)
![Twitter Follow](https://img.shields.io/twitter/follow/rpassmoilesel?style=social)

An opinionated way to create a Kubernetes cluster for self-hosting, without cloud services.

**⚠️ This is a work in progress**

## Introduction

This [Ansible](https://docs.ansible.com/ansible/latest/index.html) playbook allows to create a
Kubernetes cluster:

- That does not rely on cloud services
- With basic features: ingress controller, certificate manager, dynamic volume provisioning
- With several virtual machines or just one !

This playbook has been tested:

- With [Vagrant virtual machines](https://www.vagrantup.com/)
- On bare metal computers
- On [OVH](https://www.ovhcloud.com/)
- On [Google Cloud Compute Engine](https://cloud.google.com/compute/)

This work was inspired by https://github.com/kairen/kubeadm-ansible

**Obviously clusters created with this playbook are not as sophisticated or reliable as the engines
developed by big providers like Google Kubernetes Engine or others.**

## Table of content

<!-- toc -->

- [How to create a cluster ?](#how-to-create-a-cluster-)
  - [Prerequisites](#prerequisites)
  - [Create an environment folder](#create-an-environment-folder)
  - [Deploy](#deploy)
- [Access to your cluster API](#access-to-your-cluster-api)
- [How to create an HTTP ingress ?](#how-to-create-an-http-ingress-)
- [How to create an HTTP ingress with TLS support ?](#how-to-create-an-http-ingress-with-tls-support-)
- [How to deploy a statefulset ?](#how-to-deploy-a-statefulset-)
- [How to destroy a cluster ?](#how-to-destroy-a-cluster-)
- [Troubleshooting](#troubleshooting)
  - [Playbook failed !](#playbook-failed-)
  - [How to check that all is ok ?](#how-to-check-that-all-is-ok-)
  - [With Vagrant VMs, the API server restarts every 30 minutes](#with-vagrant-vms-the-api-server-restarts-every-30-minutes)
- [TODO](#todo)

<!-- tocstop -->

## How to create a cluster ?

This documentation assumes that you already have virtual machines:

- With an accessible static IP address
- Running Ubuntu Focal Fossa 20.04 LTS
- With root SSH access without password

### Prerequisites

On your workstation, install prerequisites:

    $ sudo apt-get install ansible netcat

Then clone this repository:

    $ git clone ...
    $ cd self-hosted-k8s

Then connect to your machines with SSH, and copy your public key:

    $ ssh-copy-id -i ~/.ssh/id_rsa.pub root@192.168.0.100
    $ ssh-copy-id -i ~/.ssh/id_rsa.pub root@192.168.0.101
    $ ssh-copy-id -i ~/.ssh/id_rsa.pub root@192.168.0.102
    ...

### Create an environment folder

Copy an environment folder:

    $ cp -R environments/multi-nodes environments/production

Then adapt your inventory file:

```
    inventory.cfg

    [master]
    192.168.0.100

    [node]
    192.168.0.101
    192.168.0.102
    192.168.0.103
    ...
```

Then on your machines check which network interface you want to use:

```
    $ ip a

    1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
        inet 127.0.0.1/8 scope host lo
           valid_lft forever preferred_lft forever
        inet6 ::1/128 scope host
           valid_lft forever preferred_lft forever
    2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
        link/ether 02:cd:65:0c:97:69 brd ff:ff:ff:ff:ff:ff
        inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3
           valid_lft 86055sec preferred_lft 86055sec
        inet6 fe80::cd:65ff:fe0c:9769/64 scope link
           valid_lft forever preferred_lft forever
    3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
        link/ether 08:00:27:c4:4e:57 brd ff:ff:ff:ff:ff:ff
        inet 192.168.0.100/24 brd 192.168.0.255 scope global enp0s8
           valid_lft forever preferred_lft forever
        inet6 fe80::a00:27ff:fec4:4e57/64 scope link
           valid_lft forever preferred_lft forever

    -> Here enp0s8 is the interface we want to use, because it is on the same network as
       the other machines, and because it has a public access.
```

Then adapt `group_vars/all.yml` file to what you need and what you want.

### Deploy

Finally, you can deploy your cluster:

    $ ansible-playbook -i environments/production/inventory.cfg bootstrap.yaml

If something fail, try to run this playbook twice or more.

## Access to your cluster API

By default a firewall is enabled, the Kubernetes API will not be accessible from outside the cluster (and
that's usually a good thing).

The recommended way to access API is to create an SSH tunnel.

Copy the kubeconfig, change the host parameter:

    $ cd self-hosted-k8s
    $ cp .kube/config/192.168.56.50/root/.kube/config ~/.kube/config
    $ nano ~/.kube/config

    # Replace this
    ...
    server: https://192.168.56.50:6443
    ...
    # With this
    ...
    server: https://localhost:6443
    ...

Then open an SSH tunnel:

    $ ssh -L 6443:localhost:6443 $MASTER_IP

You can now use your cluster:

    $ kubectl get all --all-namespaces

## How to create an HTTP ingress ?

First, deploy your application.

Then create a service:

```yaml
---
apiVersion: v1
kind: Service
metadata:
  namespace: httpbin
  labels:
    app: httpbin
  name: httpbin
spec:
  type: ClusterIP
  sessionAffinity: None
  ports:
    - port: 80
      protocol: TCP
      targetPort: 80
  selector:
    app: httpbin
```

Then create a DNS record with your DNS provider:

```
  my-app.my-hostname.io.     3304    IN      A       164.95.225.91
```

Then create an ingress:

```yaml
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  namespace: httpbin
  name: httpbin
  labels:
    app: httpbin
spec:
  rules:
    - host: my-app.my-hostname.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: httpbin
                port:
                  number: 80

  # Optional, this backend will be used if no backend match
  defaultBackend:
    service:
      name: httpbin
      port:
        number: 80
```

After few minutes, your application will be available on `my-app.my-hostname.io` port 80.

See [development/example-app](development/example-app) directory for a full working example.

See [Project Contour](https://projectcontour.io/docs/v1.18.1/config/virtual-hosts/) documentation for
more information.

## How to create an HTTP ingress with TLS support ?

Follow instructions above then create the ingress below.

Ensure that your domain is actually bind to your cluster.

```yaml
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  namespace: httpbin
  name: httpbin
  labels:
    app: httpbin
  annotations:
    kubernetes.io/ingress.class: contour
    kubernetes.io/tls-acme: "true"
    cert-manager.io/cluster-issuer: letsencrypt-staging
    ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  rules:
    - host: my-hostname.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: httpbin
                port:
                  number: 80

  # Optional, this backend will be used if no backend match
  defaultBackend:
    service:
      name: httpbin
      port:
        number: 80
```

Wait a few minutes, then check your service URL. You will get a security warning, pass throught.

Once you are sure that all is working correctly, replace `cert-manager.io/cluster-issuer: letsencrypt-staging`
by `cert-manager.io/cluster-issuer: letsencrypt-production`.

See [development/example-app](development/example-app) directory for a full working example.

See [Project Contour](https://projectcontour.io/docs/v1.18.1/config/virtual-hosts/) documentation for
more information.

## How to deploy a statefulset ?

TBD

## How to destroy a cluster ?

Use destroy playbook:

    $ ansible-playbook -i environments/production/inventory.cfg destroy.yaml

This will reset stop Kubernetes, delete configurations, and reset firewall.

## Troubleshooting

### Playbook failed !

- Try to run it twice or more
- If problem persists, run `destroy.yaml`
- Check prerequisites
- Run `bootstrap.yaml` again
- If problem persists, open an issue

### How to check that all is ok ?

Deploy examples in folder `development`.

After bootstrap a cluster can take several minutes to stabilize.

### With Vagrant VMs, the API server restarts every 30 minutes

For unknown reasons, on some workstations network is unstable. If you have a clue, open an issue !

## TODO

- Try a statefulset
- Kubernetes upgrade playbook
- Addons upgrade (contour, ...)
- Load testing
- Issue for flannel/apparmor annotations issue (see roles/k8s-flannel/templates/flannel.yml.j2)
- Try Kuma service mesh (https://kuma.io/)
