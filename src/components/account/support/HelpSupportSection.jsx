import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Package, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle2, 
  ExternalLink,
  Paperclip,
  X,
  Headphones
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const FAQS = [
  {
    category: 'Orders & Tracking',
    q: 'How can I track my order delivery?',
    a: 'You can track your order status in real time by visiting the "Orders" section in your account. Click on the specific order to view current courier dispatch status, tracking number, and expected delivery date.'
  },
  {
    category: 'Returns & Exchanges',
    q: 'What is the SwagSync return and exchange window?',
    a: 'We offer a hassle-free 7-day return and exchange policy from the date of delivery. Items must be unused, unwashed, and in their original packaging with tags intact.'
  },
  {
    category: 'Payments & Refunds',
    q: 'When will I receive my refund for returned items?',
    a: 'Once the returned package reaches our warehouse and passes quality check (usually within 24-48 hours), refunds to original payment methods take 3-5 business days. UPI refunds are processed within 24 hours.'
  },
  {
    category: 'Coupons & Offers',
    q: 'How do I apply a coupon code?',
    a: 'You can copy verified codes from the "Coupons" tab in your account. On the Shopping Bag page or during checkout, paste the promo code into the "Apply Coupon" field to get instant discounts.'
  },
  {
    category: 'Account & Shipping',
    q: 'Can I change my delivery address after placing an order?',
    a: 'If your order has not been dispatched yet, our customer support team can update your shipping address. Once shipped, address changes depend on the courier partner.'
  },
  {
    category: 'Payments & Refunds',
    q: 'What payment modes are supported on SwagSync?',
    a: 'We support all major payment options including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), Net Banking, and Cash on Delivery (COD) on eligible pin codes.'
  }
];

const HelpSupportSection = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [ticketData, setTicketData] = useState({
    category: 'Order Issues',
    orderId: '',
    message: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [createdTicketInfo, setCreatedTicketInfo] = useState(null);

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP formats are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketData.message.trim()) {
      toast.error('Please describe your issue or query');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', ticketData.category);
      formData.append('orderId', ticketData.orderId.trim());
      formData.append('message', ticketData.message.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await axios.post('/tickets', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setCreatedTicketInfo(res.data.ticket);
        setTicketSubmitted(true);
        toast.success(`Support ticket ${res.data.ticket.ticketId} created!`);
        setTicketData({ category: 'Order Issues', orderId: '', message: '' });
        removeSelectedImage();
      }
    } catch (err) {
      console.error('Ticket submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Help & Support</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Support Online
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            We are here to help you 24/7 with your orders, deliveries, and account queries.
          </p>
        </div>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-blue-50/70 to-blue-100/30 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-sm">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Live Chat</h3>
            <p className="text-xs text-gray-500 mt-1">Instant assistance from our agent</p>
          </div>
          <button
            onClick={() => toast.success('Connecting you with SwagSync assistant...')}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>Start Chat</span>
            <ExternalLink size={12} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-amber-100/30 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 shadow-sm">
              <Phone size={18} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Helpline</h3>
            <p className="text-xs text-gray-500 mt-1">Toll-free: 1800-208-SWAG</p>
          </div>
          <a
            href="tel:18002087924"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            <span>Call 9 AM - 9 PM</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm">
              <Mail size={18} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Email Us</h3>
            <p className="text-xs text-gray-500 mt-1">support@swagsync.com</p>
          </div>
          <a
            href="mailto:support@swagsync.com"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Send Email</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="bg-gradient-to-br from-[#FFF5ED] to-[#FFEDD5] border border-[#FD7100]/20 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#FD7100] text-white flex items-center justify-center mb-3 shadow-sm">
              <Package size={18} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Order Support</h3>
            <p className="text-xs text-gray-500 mt-1">Returns, tracking & refunds</p>
          </div>
          <button
            onClick={() => navigate('/account/orders')}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FD7100] hover:text-[#e06400]"
          >
            <span>View Orders</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                        {faq.category}
                      </span>
                      <span className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                        {faq.q}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              No matching questions found for "{searchQuery}". Try searching with different keywords.
            </p>
          )}
        </div>
      </div>

      {/* Submit a Support Ticket / Message */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={18} className="text-[#FD7100]" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Still need help? Send us a message
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-5">
          Our specialized customer care team will respond within 2-4 business hours.
        </p>

        {ticketSubmitted ? (
          <div className="py-6 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 text-base">Ticket Submitted Successfully!</h4>
              {createdTicketInfo?.ticketId && (
                <span className="inline-block mt-1 font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">
                  #{createdTicketInfo.ticketId}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto leading-relaxed">
              We've logged your support request. You can track updates, view responses, and reply to support anytime in your Tickets section.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => navigate('/account/tickets')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FD7100] hover:bg-[#e06400] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Headphones size={14} />
                <span>View in My Tickets</span>
              </button>
              <button
                onClick={() => {
                  setTicketSubmitted(false);
                  setCreatedTicketInfo(null);
                }}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-all"
              >
                Submit another query
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Issue Topic *
                </label>
                <select
                  value={ticketData.category}
                  onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
                >
                  <option value="Order Issues">Order Status & Delivery</option>
                  <option value="Returns & Refunds">Return or Replacement</option>
                  <option value="Payment & Billing">Payment & Refund Issue</option>
                  <option value="Coupons & Offers">Coupon / Discount Issue</option>
                  <option value="Account & Profile">Account Settings</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-12345"
                  value={ticketData.orderId}
                  onChange={(e) => setTicketData({ ...ticketData, orderId: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Describe your issue or query *
              </label>
              <textarea
                rows={3}
                placeholder="Please tell us details about what you need assistance with..."
                value={ticketData.message}
                onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Optional Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Attach Screenshot or Photo <span className="text-gray-400 font-normal">(Optional)</span>
              </label>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-[#FD7100] rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-orange-50/30 flex items-center justify-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FD7100] flex items-center justify-center shrink-0">
                    <Paperclip size={15} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-700">Click to upload photo or screenshot</p>
                    <p className="text-[11px] text-gray-400">JPG, PNG, WebP up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-sm hover:bg-red-700 transition-colors"
                    title="Remove image"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-[#FD7100]/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HelpSupportSection;
