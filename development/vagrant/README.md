# Development cluster

You can create a development cluster with [Vagrant](https://www.vagrantup.com/).

Install Vagrant and Virtualbox (Ubuntu):

    $ curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
    $ sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
    $ sudo apt-get update && sudo apt-get install vagrant virtualbox

You can optionally import your public SSH key in virtual machines:

    $ cp ~/.ssh/id_rsa.pub self-hosted-k8s/vagrant/ubuntu-20-multi-nodes
    $ cp ~/.ssh/id_rsa.pub self-hosted-k8s/vagrant/ubuntu-20-single-node

Create a cluster of 4 virtual machines:

    $ cd self-hosted-k8s/development/vagrant/ubuntu-20-multi-nodes
    $ vagrant up

Or create a single machine cluster:

    $ cd self-hosted-k8s/development/vagrant/ubuntu-20-single-node
    $ vagrant up
