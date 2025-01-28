# Access to the metadata of the user's personal secrets.
# This allows users to list their secret paths, create new metadata, and modify or delete existing metadata.
path "personal/metadata/{{ identity.entity.aliases.auth_userpass_150b3b70.name }}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Access to the actual data of the user's personal secrets.
# This allows users to create, read, update, delete, and list the secrets stored in their namespace.
path "personal/data/{{ identity.entity.aliases.auth_userpass_150b3b70.name }}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Permission to delete secrets by marking them for deletion.
# The user can specify which secret paths to delete in their personal namespace.
path "personal/delete/{{ identity.entity.aliases.auth_userpass_150b3b70.name }}/*" {
  capabilities = ["update"]
}

# Permission to undelete previously deleted secrets.
# This allows the user to recover secrets that were marked for deletion.
path "personal/undelete/{{ identity.entity.aliases.auth_userpass_150b3b70.name }}/*" {
  capabilities = ["update"]
}
