import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


ROLE_NAMES = ("Customer", "Supplier", "Administrator")


def seed_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    database = schema_editor.connection.alias
    for role_name in ROLE_NAMES:
        Role.objects.using(database).get_or_create(role_name=role_name)


def remove_seeded_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    database = schema_editor.connection.alias
    Role.objects.using(database).filter(
        role_name__in=ROLE_NAMES,
        users__isnull=True,
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_rename_id_user_user_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailVerificationToken",
            fields=[
                ("token_id", models.AutoField(primary_key=True, serialize=False)),
                ("token_hash", models.CharField(max_length=64, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="email_verification_tokens",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "email_verification_tokens",
                "ordering": ["-created_at"],
            },
        ),
        migrations.RunPython(seed_roles, remove_seeded_roles),
    ]
