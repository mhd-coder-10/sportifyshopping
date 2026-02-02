import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, HelpCircle } from "lucide-react";

const faqs = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Same-day delivery is available in select cities."
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! We offer free standard shipping on all orders over ₹2,000. Express shipping is available at an additional cost."
      },
      {
        q: "Can I track my order?",
        a: "Absolutely! Once your order ships, you'll receive a tracking number via email. You can track your package in real-time through our website or the carrier's website."
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by location."
      }
    ]
  },
  {
    category: "Returns & Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return policy for all unworn items in their original packaging. Items must be in new condition with all tags attached."
      },
      {
        q: "How do I start a return?",
        a: "Visit our Returns Center on the website, enter your order number and email, select the items you wish to return, and print your prepaid shipping label."
      },
      {
        q: "Can I exchange an item?",
        a: "Yes! You can exchange items for a different size or color. Simply start a return and place a new order for the item you want."
      },
      {
        q: "How long do refunds take?",
        a: "Once we receive your return, refunds are processed within 3-5 business days. The refund will appear on your original payment method within 5-10 business days."
      }
    ]
  },
  {
    category: "Products",
    questions: [
      {
        q: "Are your products authentic?",
        a: "Yes! We only sell 100% authentic products sourced directly from brands or authorized distributors. Every item comes with a certificate of authenticity."
      },
      {
        q: "Do you offer product warranties?",
        a: "All products come with manufacturer warranties. Most sports equipment has a 1-year warranty against manufacturing defects."
      }
    ]
  },
  {
    category: "Payment & Security",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and Shop Pay."
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely! We use industry-standard SSL encryption and never store your complete credit card information. All transactions are processed through secure payment gateways."
      },
      {
        q: "Do you offer payment plans?",
        a: "Yes! We partner with Klarna and Afterpay to offer flexible payment plans. Split your purchase into 4 interest-free payments."
      }
    ]
  }
];

const FAQs = () => {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: categories } = useCategories();
  const { cartItems, updateQuantity, removeFromCart, cartCount } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />

      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              FREQUENTLY ASKED QUESTIONS
            </h1>
            <p className="text-muted-foreground text-lg">
              Find answers to common questions about orders, shipping, returns, and more.
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((section, index) => (
              <div key={index} className="bg-card rounded-2xl p-6 md:p-8 shadow-lg">
                <h2 className="text-xl font-bold text-foreground mb-4">{section.category}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {section.questions.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`item-${index}-${faqIndex}`} className="border-b-0">
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-secondary/50 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">Can't find the answer you're looking for? Contact our support team.</p>
            <Button onClick={() => navigate("/contact")} className="bg-gradient-accent border-0 hover:opacity-90">
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
    </div>
  );
};

export default FAQs;
