#!/usr/bin/env bash

set -x
set -e

npx --yes markdown-toc@1.2.0 -i README.md
npx --yes prettier@2.7.1 --write .
