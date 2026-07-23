from django.db import migrations, models


def move_unread_counters_to_suppliers(apps, schema_editor):
    Supplier = apps.get_model('accounts', 'Supplier')
    database = schema_editor.connection.alias

    suppliers = Supplier.objects.using(database).select_related('user').all()
    for supplier in suppliers.iterator():
        supplier.unread_counter = supplier.user.unread_counter
        supplier.save(using=database, update_fields=['unread_counter'])


def move_unread_counters_to_users(apps, schema_editor):
    Supplier = apps.get_model('accounts', 'Supplier')
    User = apps.get_model('accounts', 'User')
    database = schema_editor.connection.alias

    for supplier in Supplier.objects.using(database).all().iterator():
        User.objects.using(database).filter(pk=supplier.user_id).update(
            unread_counter=supplier.unread_counter
        )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='supplier',
            name='unread_counter',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(
            move_unread_counters_to_suppliers,
            move_unread_counters_to_users,
        ),
        migrations.RemoveField(
            model_name='user',
            name='unread_counter',
        ),
        migrations.RemoveField(
            model_name='supplier',
            name='address',
        ),
        migrations.RemoveField(
            model_name='supplier',
            name='date_created',
        ),
        migrations.RemoveField(
            model_name='supplier',
            name='email',
        ),
        migrations.RemoveField(
            model_name='supplier',
            name='name',
        ),
        migrations.RemoveField(
            model_name='supplier',
            name='phone',
        ),
    ]
