import Header from "@/components/Header";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import { useState } from "react";
import { HelpCircle, MessageCircle, Phone, Mail, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Support = () => {
  const { cartItems, removeFromCart, updateQuantity, cartCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Available 9 AM - 6 PM",
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "+91 9409533674",
      action: "Mon-Sat, 9 AM - 8 PM",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "rajputdipeshkumar9@gmail.com",
      action: "Response within 24 hours",
    },
  ];

  const quickHelp = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by logging into your account and visiting the 'My Orders' section. You'll find real-time tracking information for all your orders.",
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for unused items in original packaging. Please contact our support team to initiate a return.",
    },
    {
      question: "How long does delivery take?",
      answer: "Standard delivery takes 5-7 business days. Express delivery options are available at checkout for faster shipping.",
    },
    {
      question: "Do you offer Cash on Delivery?",
      answer: "Yes! We offer Cash on Delivery (COD) for orders across India. You can select this option at checkout.",
    },
    {
      question: "How can I cancel my order?",
      answer: "Orders can be cancelled within 24 hours of placing them. Please contact our support team or visit 'My Orders' to request cancellation.",
    },
    {
      question: "Are all products genuine?",
      answer: "Absolutely! We only source products directly from authorized distributors and brands. All items come with manufacturer warranty.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartCount={cartCount} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            How Can We Help?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our support team is here to assist you with any questions or concerns
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {supportOptions.map((option, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <option.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
                <p className="text-foreground font-medium mb-1">{option.description}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  {option.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Help FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-display)' }}>
            Quick Help
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {quickHelp.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card rounded-xl px-6 border-none shadow-sm">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-card rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our team is ready to help you with any questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/contact')} size="lg">
                Contact Us
              </Button>
              <Button variant="outline" onClick={() => navigate('/faqs')} size="lg">
                View All FAQs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-background/70">© 2026 SPORTIFY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Support;
