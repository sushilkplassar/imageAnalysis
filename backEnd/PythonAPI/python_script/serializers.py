from rest_framework import serializers
from .models import File
from .models import File1
from .models import File2

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = "__all__"
class FileSerializer1(serializers.ModelSerializer):
    class Meta:
        model = File1
        fields = "__all__"        
class FileSerializer2(serializers.ModelSerializer):
    class Meta:
        model = File2
        fields = "__all__"         