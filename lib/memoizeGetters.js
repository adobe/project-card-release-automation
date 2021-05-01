/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

module.exports = (obj) => {
  Object.keys(obj).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (typeof descriptor.get === "function") {
      Object.defineProperty(obj, key, {
        get: () => {
          delete obj[key];
          obj[key] = descriptor.get.call(obj);
          return obj[key];
        },
      });
    }
  });
  return obj;
};
