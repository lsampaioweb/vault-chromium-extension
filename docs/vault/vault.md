# Vault Configurations

To use the `Vault Chromium Extension`, you need a running `HashiCorp Vault` instance. If you don’t have one, try the [Vault Docker project](https://github.com/lsampaioweb/vault-docker) for an easy setup.

### Configure Vault URL

Set the `Vault` address:

1. Run the following command:
    ```bash
    export VAULT_ADDR=https://vault.dev.homelab
    ```

### Log In to Vault

Log in using your `Vault` credentials:

1. Run the following command:
    ```bash
    vault login
    ```

If using a self-signed certificate, add `-tls-skip-verify` (use cautiously).

### Enable KV Secrets Engines

Enable secrets engines for personal and team credentials:

1. Enable the personal secrets engine:
    ```bash
    vault secrets enable -path=personal -version=2 -description="Secrets specific to individual users" kv
    ```

1. Enable the team secrets engine:
    ```bash
    vault secrets enable -path=team -version=2 -description="Shared secrets for teams or groups" kv
    ```

Verify the secrets engines:

1. Run the following command:
    ```bash
    vault secrets list
    ```

### Create Local Users

Enable the `userpass` authentication method:

1. Run the following command:
    ```bash
    vault auth enable userpass
    ```

Create users:

1. Create a user (e.g., `user1`):
    ```bash
    vault write auth/userpass/users/user1 password="userpass"
    ```

1. Create additional users if needed (e.g., `user2`):
    ```bash
    vault write auth/userpass/users/user2 password="userpass"
    ```

1. Create additional users if needed (e.g., `user3`):
    ```bash
    vault write auth/userpass/users/user3 password="userpass"
    ```

### Retrieve the Mount Accessor for `userpass`

Retrieve the mount accessor for `userpass`:

1. Run the following command:
    ```bash
    vault auth list -format=json | jq -r '.["userpass/"].accessor'
    ```

This outputs a string (e.g., `auth_userpass_150b3b70`) to use in [policy/personal.hcl](policy/personal.hcl).

### Create Policies

Apply policies:

1. Apply the policy for personal secrets:
    ```bash
    vault policy write personal policy/personal.hcl
    ```

1. Apply the policy for team secrets:
    ```bash
    vault policy write team policy/team.hcl
    ```

### Assign Policies to Users

Assign policies to users:

1. Assign policies to `user1`:
    ```bash
    vault write auth/userpass/users/user1 policies=personal,team
    ```

1. Assign policies to `user2`:
    ```bash
    vault write auth/userpass/users/user2 policies=personal
    ```

1. Assign policies to `user3`:
    ```bash
    vault write auth/userpass/users/user3 policies=personal,team
    ```

### Troubleshooting

If you encounter issues, try these solutions:

- **Vault URL not responding**:

  Ensure the URL uses `HTTPS` and matches `VAULT_ADDR`. Check that `Vault` is running.

- **Invalid username or password**:

  Verify your credentials and authentication method (`LDAP` or `userpass`).

- **Invalid token**:

  Log out and log in again via the `Login` page.

For advanced issues, open a ticket in the [GitHub repository](https://github.com/lsampaioweb/vault-chromium-extension).

[Go Back.](../../README.md)
