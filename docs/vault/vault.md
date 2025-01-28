### Vault Configurations

To enable this browser extension to interact with Vault, you need to have a running and properly configured Vault instance.

If you don’t have a Vault instance set up yet, you can quickly get started by using our [Vault](https://github.com/lsampaioweb/vault-docker) project. This repository provides an easy way to run a Vault container with all the necessary configurations.


### Vault Configuration

  - Set the Vault URL:
    ```bash
    export VAULT_ADDR=https://vault.dev.homelab
    ```

  - Log in to Vault:
    ```bash
    # Add '-tls-skip-verify' if using self-signed certificate.
    vault login
    ```

### Enable and Configure KV Secrets Engines

  - Personal Secrets (KV)
    ```bash
    # Enable a KV secrets engine for personal secrets.
    # If you omit the -version parameter, Vault defaults to KV version 1.
    vault secrets enable -path=personal -version=2 -description="Secrets specific to individual users" kv
    ```

  - Team/Shared Secrets (KV)
    ```bash
    # Enable a KV secrets engine for team/shared secrets.
    vault secrets enable -path=team -version=2 -description="Shared secrets for teams or groups" kv

    # (Optional) Verify the secrets engine is enabled.
    vault secrets list
    ```

### Create Local Users

  - Vault provides an `userpass` authentication method to create local users with passwords.

    ```bash
    # Enable the userpass authentication method
    vault auth enable userpass

    # Create user1
    vault write auth/userpass/users/user1 password="userpass"

    # Create user2
    vault write auth/userpass/users/user2 password="userpass"

    # Create user3
    vault write auth/userpass/users/user3 password="userpass"
    ```

### Retrieve the Mount Accessor for `userpass`

  - To retrieve the mount accessor for the `userpass` authentication method, run the following command:

    ```bash
    vault auth list -format=json | jq -r '.["userpass/"].accessor'
    ```

  - This command will output a string representing the mount accessor for the `userpass` auth method, which you’ll need when defining policies.

    For example, the output might look like this:
    ```bash
    auth_userpass_150b3b70
    ```

    You should include this accessor string in the policy file [docs/vault/policy/personal.hcl](policy/personal.hcl) where applicable.

### Create Policies

  Policies define which resources (paths) users can access and their actions (capabilities).

  - Policy for [Personal](policy/personal.hcl) Secrets
    ```bash
    vault policy write personal docs/vault/policy/personal.hcl
    ```

  - Policy for [Team](policy/team.hcl) Secrets
    ```bash
    vault policy write team docs/vault/policy/team.hcl
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
