#!/usr/bin/env node

/**
 * This script create, prepare and delete  a development environment on Google Cloud Plateform.
 *
 * Usage:
 *
 *  $ ./development/gcloud/gcloud.js create
 *  $ ./development/gcloud/gcloud.js delete
 *  $ ./development/gcloud/gcloud.js prepare
 *
 */

const options = {
  numberOfVms: 4,
  machineType: "e2-medium",
  zone: "europe-west9-a",
  image: "projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20220701",
};

const { execSync } = require("child_process");

main(options).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

async function main(options) {
  const doCreate = process.argv.find((arg) => arg === "create");
  const doDelete = process.argv.find((arg) => arg === "delete");
  const doPrepare = process.argv.find((arg) => arg === "prepare");

  if (doCreate) {
    for (let i = 0; i < options.numberOfVms; i++) {
      createVm(`vm-${i}`, options.zone, options.machineType, options.image);
    }
  } else if (doDelete) {
    for (let i = 0; i < options.numberOfVms; i++) {
      deleteVm(`vm-${i}`, options.zone);
    }
  } else if (doPrepare) {
    for (let i = 0; i < options.numberOfVms; i++) {
      prepareVm(`vm-${i}`, options.zone);
    }
  } else {
    console.log("Try ./gcloud.js create | delete");
    throw new Error("Unknown command: " + process.argv.join(" "));
  }
}

function createVm(vmName, zone, machineType, image) {
  shellCommand(`gcloud compute instances create ${vmName} \
            --zone=${zone} --machine-type=${machineType} \
            --network-interface=network-tier=PREMIUM,subnet=default \
            --maintenance-policy=MIGRATE --provisioning-model=STANDARD \
            --create-disk=auto-delete=yes,boot=yes,device-name=${vmName},image=${image},mode=rw,size=10    
    `);
}

function deleteVm(vmName, zone) {
  shellCommand(`gcloud compute instances delete ${vmName} --zone=${zone} -q`);
}

function prepareVm(vmName, zone) {
  const prepareScript = __dirname + "/prepare.sh";
  shellCommand(
    `gcloud compute scp ${prepareScript} ${vmName}:/tmp/prepare.sh --zone ${zone}`
  );
  shellCommand(
    `gcloud compute ssh --zone ${zone} ${vmName} -- /tmp/prepare.sh`
  );
}

function shellCommand(command) {
  console.log("Executing: " + command);
  execSync(command, { shell: "/bin/bash" });
}
