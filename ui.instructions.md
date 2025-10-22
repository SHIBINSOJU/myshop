{
  "adminPanel": {
    "sidebarNav": [
      {"id": "dashboard", "label": "Dashboard", "icon": "fa-tachometer-alt", "url": "/admin/dashboard"},
      {"id": "products", "label": "Products", "icon": "fa-box", "url": "/admin/products"},
      {"id": "orders", "label": "Orders", "icon": "fa-shopping-cart", "url": "/admin/orders"},
      {"id": "customers", "label": "Customers", "icon": "fa-users", "url": "/admin/customers"},
      {"id": "categories", "label": "Categories", "icon": "fa-tags", "url": "/admin/categories"},
      {"id": "discounts", "label": "Discounts", "icon": "fa-gift", "url": "/admin/discounts"},
      {"id": "settings", "label": "Settings", "icon": "fa-cog", "url": "/admin/settings"},
      {"id": "analytics", "label": "Analytics", "icon": "fa-chart-bar", "url": "/admin/analytics"}
    ],
    "dashboardWidgets": [
      {
        "id": "salesSummary",
        "title": "Sales Summary",
        "type": "chart",
        "chartType": "line",
        "dataEndpoint": "/api/admin/sales-summary"
      },
      {
        "id": "newOrders",
        "title": "New Orders",
        "type": "list",
        "dataEndpoint": "/api/admin/new-orders",
        "link": "/admin/orders"
      },
      {
        "id": "stockAlerts",
        "title": "Low Stock Alerts",
        "type": "list",
        "dataEndpoint": "/api/admin/stock-alerts",
        "link": "/admin/products?status=low_stock"
      }
    ],
    "productFormFields": [
      {"id": "name", "label": "Product Name", "type": "text", "required": true, "placeholder": "e.g., Sleek White Hoodie"},
      {"id": "description", "label": "Description", "type": "textarea", "required": false, "placeholder": "A brief description of the product."},
      {"id": "price", "label": "Price", "type": "number", "required": true, "min": 0, "step": 0.01},
      {"id": "category", "label": "Category", "type": "select", "optionsEndpoint": "/api/admin/categories", "required": true},
      {"id": "stock", "label": "Stock Quantity", "type": "number", "required": true, "min": 0},
      {"id": "images", "label": "Product Images", "type": "file-upload", "multiple": true, "accept": "image/*"},
      {"id": "isFeatured", "label": "Featured Product", "type": "checkbox"}
    ]
  }
}