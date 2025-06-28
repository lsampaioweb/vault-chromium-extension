# Team Policy for Vault Chromium Extension
#
# This policy grants team members access to shared secrets in the `Vault` KV secrets engine
# under the `team/` path. It allows listing, reading, creating, updating, and deleting
# team-shared credentials.

# Grants full access to team secrets, enabling collaborative management.
path "team/*" {
  capabilities = ["list", "read", "create", "update", "delete"]
}
