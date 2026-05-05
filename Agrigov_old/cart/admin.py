from django.contrib import admin

from cart.models import CartItem , Cart
admin.site.register(Cart);
admin.site.register(CartItem);