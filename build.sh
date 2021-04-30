#!/usr/bin/env bash

# Copyright 2021 Adobe. All rights reserved.
# This file is licensed to you under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License. You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
# OF ANY KIND, either express or implied. See the License for the specific language
# governing permissions and limitations under the License.

npx ncc build initialize-card/index.js -o initialize-card/dist --source-map --license licenses.txt
npx ncc build record-release/index.js -o record-release/dist --source-map --license licenses.txt
npx ncc build trigger-release/index.js -o trigger-release/dist --source-map --license licenses.txt
npx ncc build validate-version/index.js -o validate-version/dist --source-map --license licenses.txt
