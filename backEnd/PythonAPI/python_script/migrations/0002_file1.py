# Generated by Django 2.2.1 on 2019-05-13 09:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('python_script', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='File1',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file1', models.FileField(upload_to='')),
            ],
        ),
    ]
