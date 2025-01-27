### Vault Configurations

To enable the extension to interact with Vault, specific policies need to be created. These policies grant permissions for the extension to list, read, create, update, and delete secrets securely.

### Vault Configuration

  - Set the Vault URL:
    ```bash
    export VAULT_ADDR=https://vault.dev.homelab
    ```

  - Log in to Vault:
    ```bash
    # Add '-tls-skip-verify' if using self-signed certificate
    vault login -tls-skip-verify
    ```

### Enable and Configure KV Secrets Engines

  - Personal Secrets (KV)
    ```bash
    # Enable a KV secrets engine for personal secrets.
    # If you omit the -version parameter, Vault defaults to KV version 1.
    vault secrets enable -path=personal -version=2 kv
    ```

  - Team/Shared Secrets (KV)
    ```bash
    # Enable a KV secrets engine for team/shared secrets.
    vault secrets enable -path=team -version=2 kv

    # (Optional) Verify the secrets engine is enabled.
    vault secrets list
    ```

### Create Local Users

  - Vault provides an `userpass` authentication method to create local users with passwords.

    ```bash
    # Enable the userpass authentication method
    vault auth enable userpass

    # Create user1
    vault write auth/userpass/users/user1 password="???"

    # Create user2
    vault write auth/userpass/users/user2 password="???"

    # Create user3
    vault write auth/userpass/users/user3 password="???"
    ```

### Get the Mount Accessor for `userpass`

  - To get the mount accessor for the userpass authentication method, use the following command:
    ```bash
    vault auth list -format=json | jq -r '.["userpass/"].accessor'
    ```

  - This will output a string, which is the mount accessor for the userpass auth method. For example:
    ```bash
    auth_userpass_0c6e2b74
    ```

### Create Policies

  Policies define which resources (paths) users can access and their actions (capabilities).

  - Policy for Personal Secrets
    ```bash
    # File: policy/personal.hcl
    # Access to the metadata of the user's personal secrets.
    # This allows users to list their secret paths, create new metadata, and modify or delete existing metadata.
    path "personal/metadata/{{identity.entity.aliases.auth_userpass_0c6e2b74.name}}/*" {
      capabilities = ["create", "read", "update", "delete", "list"]
    }

    # Access to the actual data of the user's personal secrets.
    # This allows users to create, read, update, delete, and list the secrets stored in their namespace.
    path "personal/data/{{identity.entity.aliases.auth_userpass_0c6e2b74.name}}/*" {
      capabilities = ["create", "read", "update", "delete", "list"]
    }

    # Permission to delete secrets by marking them for deletion.
    # The user can specify which secret paths to delete in their personal namespace.
    path "personal/delete/{{identity.entity.aliases.auth_userpass_0c6e2b74.name}}/*" {
      capabilities = ["update"]
    }

    # Permission to undelete previously deleted secrets.
    # This allows the user to recover secrets that were marked for deletion.
    path "personal/undelete/{{identity.entity.aliases.auth_userpass_0c6e2b74.name}}/*" {
      capabilities = ["update"]
    }
    ```

    Write this policy to Vault:
    ```bash
    vault policy write personal policy/personal.hcl
    ```

  - Policy for Team Secrets (For user1 and user3)
    ```bash
    # File: policy/team.hcl
    path "team/*" {
      capabilities = ["create", "read", "update", "delete", "list"]
    }
    ```

    Write this policy to Vault:
    ```bash
    vault policy write team policy/team.hcl
    ```

### Assign Policies to Users

  Policies are attached to users via roles in the `userpass` authentication method.

  - Policy for Personal Secrets
    ```bash
    # Assign the personal to user1, user2, and user3
    vault write auth/userpass/users/user1 policies=personal,team
    vault write auth/userpass/users/user2 policies=personal
    vault write auth/userpass/users/user3 policies=personal,team
    ```

[Go Back.](../../README.md)
