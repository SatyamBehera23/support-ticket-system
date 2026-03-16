from django.shortcuts import render

# Create your views here.
from rest_framework import generics,filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ticket
from .serializers import TicketSerializer

from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response


class TicketListCreateView(generics.ListCreateAPIView):

    queryset = Ticket.objects.all().order_by("-created_at")
    serializer_class = TicketSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    filterset_fields = ["category", "priority", "status"]
    search_fields = ["title", "description"]


class TicketUpdateView(generics.UpdateAPIView):

    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    
    
class TicketStatsView(APIView):

    def get(self, request):

        total_tickets = Ticket.objects.count()

        open_tickets = Ticket.objects.filter(status="open").count()

        priority_counts = (
            Ticket.objects.values("priority")
            .annotate(count=Count("id"))
        )

        category_counts = (
            Ticket.objects.values("category")
            .annotate(count=Count("id"))
        )

        return Response({
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "priority_breakdown": priority_counts,
            "category_breakdown": category_counts
        })