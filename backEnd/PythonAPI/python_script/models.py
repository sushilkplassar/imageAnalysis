from django.db import models

class File(models.Model):
    file = models.FileField(blank=False, null=False)
    def __str__(self):
        return self.file.name
class File1(models.Model):
    file1 = models.FileField(blank=False, null=False)
    def __str__(self):
        return self.file1.name
class File2(models.Model):
    file2 = models.FileField(blank=False, null=False)
    def __str__(self):
        return self.file2.name                  