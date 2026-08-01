from django.db import migrations


def rename_role(apps, schema_editor, old_name, new_name):
    Role = apps.get_model("accounts", "Role")
    User = apps.get_model("accounts", "User")
    database = schema_editor.connection.alias

    old_role = Role.objects.using(database).filter(role_name=old_name).first()
    if old_role is None:
        return

    new_role = Role.objects.using(database).filter(role_name=new_name).first()
    if new_role is None:
        old_role.role_name = new_name
        old_role.save(using=database, update_fields=["role_name"])
        return

    User.objects.using(database).filter(role_id=old_role.pk).update(role_id=new_role.pk)
    old_role.delete(using=database)


def rename_administrator_to_admin(apps, schema_editor):
    rename_role(apps, schema_editor, "Administrator", "Admin")


def rename_admin_to_administrator(apps, schema_editor):
    rename_role(apps, schema_editor, "Admin", "Administrator")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0005_emailverificationtoken_seed_roles"),
    ]

    operations = [
        migrations.RunPython(
            rename_administrator_to_admin,
            rename_admin_to_administrator,
        ),
    ]
