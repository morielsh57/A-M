from django.contrib import admin

from payments.models import Payment, PaymentItem


admin.site.register(Payment)
admin.site.register(PaymentItem)
